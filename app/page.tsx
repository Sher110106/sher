import Image from 'next/image'
import Link from 'next/link'
import Image1 from "./Image1.jpeg"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Clock, Bell, Video, ArrowRight } from 'lucide-react'

export default function Page() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-8 sm:py-12 md:py-16 lg:py-20 xl:py-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10 -z-10" />
        
        <div className="max-w-6xl mx-auto text-center space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12 animate-fade-in px-4">
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight">
              Bridge Teacher Gaps
              <span className="block text-primary">Seamlessly</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-2 sm:px-4">
              Empowering Schools with On-Demand Access to Qualified Teachers
            </p>
          </div>
          
          <div className="relative max-w-4xl mx-auto px-2 sm:px-4">
            <div className="relative overflow-hidden rounded-lg sm:rounded-xl md:rounded-2xl shadow-xl sm:shadow-2xl">
              <Image
                src={Image1}
                alt="Virtual classroom scenario"
                width={800}
                height={500}
                className="w-full h-auto object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12 px-4">
          <div className="text-center space-y-3 sm:space-y-4 animate-slide-up">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">Key Benefits</h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2 sm:px-4">
              Discover how Quad transforms education through seamless teacher-school connections
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[
              { 
                title: "Instant Teacher Access", 
                description: "Quickly request qualified substitute teachers when needed.",
                icon: Clock,
                color: "text-blue-500"
              },
              { 
                title: "Seamless Integration", 
                description: "Effortlessly match with experienced substitutes for uninterrupted education.",
                icon: CheckCircle,
                color: "text-green-500"
              },
              { 
                title: "Real-Time Updates", 
                description: "Stay updated with teacher availability and instant notifications.",
                icon: Bell,
                color: "text-amber-500"
              },
            ].map((benefit, index) => (
              <Card key={index} interactive className="group animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="p-4 sm:p-6 lg:p-8 text-center space-y-3 sm:space-y-4">
                  <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl bg-secondary/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className={`h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 ${benefit.color}`} />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold">{benefit.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-secondary/20">
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12 px-4">
          <div className="text-center space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">How It Works</h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2 sm:px-4">
              Three simple steps to connect schools with qualified teachers
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            {[
              { 
                step: "01",
                title: "Submit a Request", 
                description: "Using subject, topic, date, and time select the teacher" 
              },
              { 
                step: "02",
                title: "Get Matched", 
                description: "Connect with a qualified substitute teacher as they accept the request." 
              },
              { 
                step: "03",
                title: "Start Teaching", 
                description: "Automatic meeting link generated and recorded sessions saved." 
              },
            ].map((step, index) => (
              <div key={index} className="text-center space-y-4 sm:space-y-6 animate-slide-up" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="relative">
                  <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-base sm:text-lg md:text-2xl font-bold shadow-lg">
                    {step.step}
                  </div>
                  {index < 2 && (
                    <ArrowRight className="hidden lg:block absolute top-1/2 -translate-y-1/2 left-full ml-6 h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold">{step.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed px-2">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6 md:space-y-8 px-4">
          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="p-4 sm:p-6 md:p-8 lg:p-12">
              <blockquote className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-semibold text-foreground leading-relaxed">
                "This app can revolutionize how we handle teacher absences. It's efficient, reliable, and students are going to love it!"
              </blockquote>
              <div className="mt-4 sm:mt-6 md:mt-8">
                <p className="text-sm sm:text-base md:text-lg font-medium text-primary">— Quad Team</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-secondary/20">
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12 px-4">
          <div className="text-center space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">Features</h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2 sm:px-4">
              Everything you need for seamless teacher-school connections
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            {[
              { icon: CheckCircle, title: "Customizable for Local Needs", color: "text-green-500" },
              { icon: Bell, title: "Real-Time Notifications", color: "text-blue-500" },
              { icon: Video, title: "Automated Meeting Links", color: "text-purple-500" },
              { icon: Clock, title: "Session Recordings", color: "text-amber-500" },
            ].map((feature, index) => (
              <div key={index} className="text-center space-y-2 sm:space-y-3 md:space-y-4 group animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-2xl bg-card shadow-md flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <feature.icon className={`h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-xs sm:text-sm md:text-base leading-relaxed px-1">{feature.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call-to-Action */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6 md:space-y-8 px-4">
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">Ready to Get Started?</h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2 sm:px-4">
              Join a network of schools and teachers revolutionizing education
            </p>
          </div>
          
          <Link href="/sign-up">
            <Button size="lg" className="text-sm sm:text-base md:text-lg px-6 sm:px-8 py-3 sm:py-4 md:py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group">
              Get Started Today
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-secondary/20">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12 px-4">
          <div className="text-center space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">Frequently Asked Questions</h2>
          </div>
          
          <div className="grid gap-3 sm:gap-4 md:gap-6">
            {[
              {
                question: "How does the school request teacher",
                answer: "Schools can choose from the list of teachers and can filter through and then choose from them to send request to"
              },
              {
                question: "Is it free to sign up?",
                answer: "Yes, signing up is completely free."
              }
            ].map((faq, index) => (
              <Card key={index} interactive className="group">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2 sm:mb-3 group-hover:text-primary transition-colors duration-300">
                    {faq.question}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6 px-4">
          <Card className="bg-gradient-to-br from-card to-secondary/10">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="space-y-2 sm:space-y-3">
                <p className="text-xs sm:text-sm md:text-base lg:text-lg">
                  <span className="font-semibold">Contact us:</span>{" "}
                  <a href="mailto:sher.singh.ug23@plaksha.edu.in" className="text-primary hover:underline break-all">
                    sher.singh.ug23@plaksha.edu.in
                  </a>
                </p>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                  Built with ❤️ by Quad Team
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

